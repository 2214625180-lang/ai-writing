import { NextResponse, type NextRequest } from "next/server";

import { AuthError } from "@/lib/auth";
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
  errorMessage: string;
}) {
  try {
    await generationService.markGenerationFailed(params);
  } catch {
    // The original generation error is more useful than a secondary DB update failure.
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
      return createErrorResponse("Template is not active.", 404);
    }

    await generationService.markGenerationStreaming(generation.id);

    const prompt = buildWritingPrompt({
      input: generation.input,
      templatePrompt: generation.template?.prompt
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

      await markGenerationFailedSafely({
        generationId: generation.id,
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

          await usageService.recordGenerationUsage({
            userId: currentUser.id,
            generationId: generation.id,
            tokens: totalTokens
          });

          controller.close();
        } catch (error) {
          await markGenerationFailedSafely({
            generationId: generation.id,
            errorMessage: getErrorMessage(error)
          });

          controller.error(error);
        }
      },
      async cancel() {
        await markGenerationFailedSafely({
          generationId: generation.id,
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

    return createErrorResponse("Failed to stream generation.", 500);
  }
}
