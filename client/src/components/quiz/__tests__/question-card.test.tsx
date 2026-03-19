import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "../question-card";
import type { Question } from "@shared/schema";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 1,
    text: "Wie viele Bundesländer hat Deutschland?",
    answers: ["14", "15", "16", "17"],
    correctAnswer: 3, // 1-indexed: "16"
    explanation: "Deutschland hat 16 Bundesländer.",
    category: "Bundesweit",
    difficulty: "mittel",
    hasImage: false,
    imagePath: null,
    ...overrides,
  };
}

describe("QuestionCard", () => {
  it("renders the question text", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Wie viele Bundesländer hat Deutschland?"),
    ).toBeInTheDocument();
  });

  it("renders all four answer options", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("calls onAnswerSelect when an answer is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        onAnswerSelect={onSelect}
      />,
    );

    await user.click(screen.getByText("16"));
    expect(onSelect).toHaveBeenCalledWith(2); // index 2 for "16"
  });

  it("disables answers after selection", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        selectedAnswer={2}
        onAnswerSelect={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it("shows image button for questions with images", () => {
    render(
      <QuestionCard
        question={makeQuestion({ hasImage: true, imagePath: "test.png" })}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Bild anzeigen")).toBeInTheDocument();
  });

  it("does not show image button for questions without images", () => {
    render(
      <QuestionCard
        question={makeQuestion({ hasImage: false, imagePath: null })}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText("Bild anzeigen")).not.toBeInTheDocument();
  });

  it("shows feedback when showFeedback and immediateFeedback are true", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        selectedAnswer={2} // correct: 2+1=3=correctAnswer
        showFeedback={true}
        immediateFeedback={true}
        onAnswerSelect={vi.fn()}
      />,
    );

    // AnswerFeedback renders correct/incorrect messages
    // Check for the correct answer text from explanation
    expect(screen.getByText(/Richtig/i)).toBeInTheDocument();
  });

  it("shows incorrect feedback for wrong answer", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        selectedAnswer={0} // wrong: 0+1=1≠3
        showFeedback={true}
        immediateFeedback={true}
        onAnswerSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/Falsch/i)).toBeInTheDocument();
  });

  it("does not show feedback when showFeedback is false", () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        questionNumber={1}
        selectedAnswer={2}
        showFeedback={false}
        immediateFeedback={true}
        onAnswerSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Richtig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Falsch/i)).not.toBeInTheDocument();
  });
});
