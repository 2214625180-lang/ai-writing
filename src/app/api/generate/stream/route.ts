import { NextResponse, type NextRequest } from "next/server";

import { AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { openai } from "@/lib/openai";
import { buildWritingPrompt } from "@/lib/prompts";
import { generationService } from "@/services/generation.service";
import { usageService } from "@/services/usage.service";
import { userService } from "@/services/user.service";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      error: message
    },
    {
      status
    }
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown generation stream error.";
}

function estimateTokenCount(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return Math.ceil(text.length / 4);
}

async function markGenerationFailedSafely(params: {
  generationId: string;
  userId: string;
  errorMessage: string;
}) {
  try {
    await generationService.markGenerationFailed(params);
    await usageService.releaseGenerationUsageReservation({
      userId: params.userId,
      generationId: params.generationId
    });
  } catch (error) {
    logger.error({
      event: "ai_generation_failure_state_update_failed",
      message: "Failed to mark generation as failed or release usage reservation.",
      context: {
        generationId: params.generationId,
        userId: params.userId
      },
      error
    });
  }
}

export async function GET(request: NextRequest) {
  const generationId = request.nextUrl.searchParams.get("generationId");

  if (!generationId) {
    return createErrorResponse("Missing generationId.", 400);
  }

  try {
    const currentUser = await userService.getCurrentUser();
    const generation = await generationService.getGenerationForStream(generationId);

    if (!generation) {
      return createErrorResponse("Generation not found.", 404);
    }

    if (generation.userId !== currentUser.id) {
      return createErrorResponse("Forbidden.", 403);
    }

    if (generation.template && !generation.template.isActive) {
      logger.warn({
        event: "ai_generation_template_inactive",
        message: "Generation cannot stream because the linked template is inactive.",
        context: {
          generationId: generation.id,
          userId: currentUser.id,
          templateId: generation.template.id
        }
      });

      await markGenerationFailedSafely({
        generationId: generation.id,
        userId: currentUser.id,
        errorMessage: "Template is not active."
      });

      return createErrorResponse("Template is not active.", 404);
    }

    await generationService.markGenerationStreaming(generation.id);

    const prompt = buildWritingPrompt({
      input: generation.input
    });

    let openAIStream;

    try {
      openAIStream = await openai.chat.completions.create(
        {
          model: generation.model,
          stream: true,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          signal: request.signal
        }
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      logger.error({
        event: "ai_generation_stream_start_failed",
        message: "Failed to start OpenAI streaming request.",
        context: {
          generationId: generation.id,
          userId: currentUser.id,
          model: generation.model
        },
        error
      });

      await markGenerationFailedSafely({
        generationId: generation.id,
        userId: currentUser.id,
        errorMessage
      });

      return createErrorResponse(
        `Failed to start AI generation stream: ${errorMessage}`,
        500
      );
    }

    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const outputChunks: string[] = [];

        try {
          for await (const chunk of openAIStream) {
            if (request.signal.aborted) {
              throw new Error("Generation request was aborted.");
            }

            const content = chunk.choices[0]?.delta?.content;

            if (!content) {
              continue;
            }

            outputChunks.push(content);
            controller.enqueue(encoder.encode(content));
          }

          const output = outputChunks.join("");
          const promptTokens = estimateTokenCount(prompt);
          const outputTokens = estimateTokenCount(output);
          const totalTokens = promptTokens + outputTokens;

          await generationService.markGenerationCompleted({
            generationId: generation.id,
            output,
            promptTokens,
            outputTokens,
            totalTokens
          });

          await usageService.attachGenerationUsageTokens({
            userId: currentUser.id,
            generationId: generation.id,
            tokens: totalTokens
          });

          controller.close();
        } catch (error) {
          logger.error({
            event: "ai_generation_stream_failed",
            message: "AI generation stream failed after it started.",
            context: {
              generationId: generation.id,
              userId: currentUser.id,
              model: generation.model
            },
            error
          });

          await markGenerationFailedSafely({
            generationId: generation.id,
            userId: currentUser.id,
            errorMessage: getErrorMessage(error)
          });

          controller.error(error);
        }
      },
      async cancel() {
        logger.warn({
          event: "ai_generation_stream_canceled",
          message: "AI generation stream was canceled by the client.",
          context: {
            generationId: generation.id,
            userId: currentUser.id
          }
        });

        await markGenerationFailedSafely({
          generationId: generation.id,
          userId: currentUser.id,
          errorMessage: "Generation stream was canceled by the client."
        });
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResponse("Unauthorized.", 401);
    }

    logger.error({
      event: "ai_generation_route_failed",
      message: "AI generation route failed before streaming response was created.",
      context: {
        generationId
      },
      error
    });

    return createErrorResponse("Failed to stream generation.", 500);
  }
}
