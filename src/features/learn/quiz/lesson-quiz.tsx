"use client";

import { ArrowRight, CircleCheck, CircleX, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { recordQuizResult } from "../progress/progress-store";
import type { QuizQuestion } from "../schema";
import { scoreMessage } from "./score";

/*
 * The end-of-lesson quiz, one question at a time: pick an option, check it,
 * read why, move on. The final score is saved in this browser and marks the
 * lesson as done on the track page.
 */

interface NextLesson {
  number: number;
  title: string;
  href: string;
  published: boolean;
}

type Phase = "answering" | "checked" | "complete";

export function LessonQuiz({
  progressKey,
  questions,
  next,
  trackHref,
}: {
  progressKey: string;
  questions: QuizQuestion[];
  next: NextLesson | null;
  trackHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("answering");

  const legendRef = useRef<HTMLLegendElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const scoreRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);

  // Keep keyboard and screen-reader users in step as the quiz moves on.
  useEffect(() => {
    if (!started.current) return;
    if (phase === "answering") legendRef.current?.focus();
    if (phase === "checked") nextButtonRef.current?.focus();
    if (phase === "complete") scoreRef.current?.focus();
  }, [phase, index]);

  const total = questions.length;
  const question = questions[index];
  const score = answers.filter((answer, i) => answer === questions[i]?.answer).length;

  function check() {
    if (selected === null) return;
    started.current = true;
    setAnswers((previous) => [...previous.slice(0, index), selected]);
    setPhase("checked");
  }

  function advance() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
      setPhase("answering");
      return;
    }
    const finalScore = answers.filter((answer, i) => answer === questions[i]?.answer).length;
    recordQuizResult(progressKey, finalScore, total);
    setPhase("complete");
  }

  function retry() {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setPhase("answering");
  }

  return (
    <section
      id="quiz"
      aria-labelledby="quiz-title"
      className="flex scroll-mt-6 flex-col gap-4 pt-12"
    >
      <h2 id="quiz-title" className="m-0 font-display text-h2">
        Check your understanding
      </h2>

      <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <span className="text-small text-text-muted">
            {phase === "complete" ? "Quiz complete" : `Question ${index + 1} of ${total}`}
          </span>
          <ProgressBar
            size="sm"
            label="Quiz progress"
            value={phase === "complete" ? total : index + 1}
            max={total}
            valueText={
              phase === "complete"
                ? `All ${total} questions answered`
                : `Question ${index + 1} of ${total}`
            }
          />
        </div>

        {phase === "complete" ? (
          <QuizScore
            ref={scoreRef}
            questions={questions}
            answers={answers}
            score={score}
            next={next}
            trackHref={trackHref}
            onRetry={retry}
          />
        ) : (
          question && (
            <>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend
                  ref={legendRef}
                  tabIndex={-1}
                  className="mb-4 p-0 font-display text-title focus:outline-none"
                >
                  {question.prompt}
                </legend>
                {phase === "answering" ? (
                  <div className="flex flex-col gap-3">
                    {question.options.map((option, i) => (
                      <label
                        key={i}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-4 py-3",
                          "transition-[background-color,border-color] duration-[180ms] ease-tpb hover:border-text-muted",
                          "has-[:checked]:border-amber has-[:checked]:bg-amber-subtle",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${progressKey}-${question.id}`}
                          value={i}
                          checked={selected === i}
                          onChange={() => setSelected(i)}
                          className="size-5 flex-none cursor-pointer appearance-none rounded-pill border-2 border-border-strong transition-[border-width,border-color] duration-150 ease-tpb checked:border-[6px] checked:border-amber"
                        />
                        <span className="flex-auto">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {question.options.map((option, i) => (
                      <CheckedOption
                        key={i}
                        option={option}
                        correct={i === question.answer}
                        chosen={i === answers[index]}
                      />
                    ))}
                  </ul>
                )}
              </fieldset>

              <div role="status" aria-live="polite">
                {phase === "checked" && (
                  <Feedback
                    correct={answers[index] === question.answer}
                    explanation={question.explanation}
                  />
                )}
              </div>

              <div>
                {phase === "answering" ? (
                  <Button onClick={check} disabled={selected === null} className="px-5">
                    Check answer
                  </Button>
                ) : (
                  <Button ref={nextButtonRef} onClick={advance} className="group px-5">
                    {index + 1 < total ? "Next question" : "See your score"}
                    <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
                  </Button>
                )}
              </div>
            </>
          )
        )}
      </div>
    </section>
  );
}

function CheckedOption({
  option,
  correct,
  chosen,
}: {
  option: string;
  correct: boolean;
  chosen: boolean;
}) {
  const label = correct
    ? chosen
      ? "Your answer · Correct"
      : "Correct"
    : chosen
      ? "Your answer"
      : null;
  return (
    <li
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-4 py-3 sm:flex-nowrap",
        correct
          ? "border-2 border-success bg-success-subtle"
          : chosen
            ? "border-2 border-danger bg-danger-subtle"
            : "border border-border-strong bg-surface-raised",
      )}
    >
      {correct ? (
        <CircleCheck aria-hidden className="size-5 flex-none text-success" />
      ) : chosen ? (
        <CircleX aria-hidden className="size-5 flex-none text-danger" />
      ) : (
        <span aria-hidden className="size-5 flex-none rounded-pill border-2 border-border-strong" />
      )}
      <span className="min-w-0 flex-[1_1_0]">{option}</span>
      {label && (
        <span
          className={cn(
            "basis-full pl-8 font-display text-label sm:basis-auto sm:pl-0",
            correct ? "text-success" : "text-danger",
          )}
        >
          {label}
        </span>
      )}
    </li>
  );
}

function Feedback({ correct, explanation }: { correct: boolean; explanation: string }) {
  const Icon = correct ? CircleCheck : CircleX;
  return (
    <div
      className={cn(
        "tpb-in flex gap-3 rounded-md px-4 py-4 sm:px-5",
        correct ? "bg-success-subtle" : "bg-danger-subtle",
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-[3px] size-5 flex-none", correct ? "text-success" : "text-danger")}
      />
      <div className="flex flex-col gap-1">
        <p className="m-0 font-semibold">{correct ? "Correct!" : "Not quite"}</p>
        <p className="m-0">{explanation}</p>
      </div>
    </div>
  );
}

function QuizScore({
  ref,
  questions,
  answers,
  score,
  next,
  trackHref,
  onRetry,
}: {
  ref: React.Ref<HTMLHeadingElement>;
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  next: NextLesson | null;
  trackHref: string;
  onRetry: () => void;
}) {
  const total = questions.length;
  const missed = questions.flatMap((q, i) => (answers[i] === q.answer ? [] : [i + 1]));

  return (
    <>
      <div role="status" className="flex flex-col gap-2">
        <h3 ref={ref} tabIndex={-1} className="m-0 font-display text-h3 focus:outline-none">
          You scored <span className="text-accent-text">{score}</span> of {total}
        </h3>
        <p className="m-0">{scoreMessage(score, total, missed)}</p>
      </div>

      <ol className="m-0 list-none border-t border-border p-0">
        {questions.map((q, i) => {
          const right = answers[i] === q.answer;
          return (
            <li
              key={q.id}
              className="flex min-h-[52px] items-center gap-3 border-b border-border py-3"
            >
              {right ? (
                <CircleCheck aria-hidden className="size-5 flex-none text-success" />
              ) : (
                <CircleX aria-hidden className="size-5 flex-none text-danger" />
              )}
              <span className="min-w-0 flex-auto">
                {i + 1}. {q.prompt}
              </span>
              <span
                className={cn(
                  "flex-none font-display text-label",
                  right ? "text-success" : "text-danger",
                )}
              >
                {right ? "Correct" : "Not quite"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onRetry} className="px-5">
          <RotateCcw aria-hidden className="size-4" />
          Retry quiz
        </Button>
        {next?.published ? (
          <Link href={next.href} className={buttonVariants({ variant: "primary" }, "group px-5")}>
            Next lesson: {next.title}
            <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
          </Link>
        ) : (
          <Link href={trackHref} className={buttonVariants({ variant: "primary" }, "group px-5")}>
            Back to the track
            <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
          </Link>
        )}
      </div>
      {next && !next.published && (
        <p className="m-0 text-small text-text-muted">
          Lesson {next.number}, {next.title}, is coming soon.
        </p>
      )}
    </>
  );
}
