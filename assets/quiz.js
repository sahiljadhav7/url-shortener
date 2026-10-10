/*
  Reusable multiple-choice quiz widget.

  Markup:
    <div class="quiz" data-answer="b">
      <p class="q">Question text</p>
      <button data-opt="a">...</button>
      <button data-opt="b">...</button>
      <p class="why">Explanation shown after any answer.</p>
    </div>

  Options are shuffled on load so position never gives the answer away.
*/
(function () {
  const css = `
    .quiz { background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 1rem 1.1rem; margin: 1.2rem 0; }
    .quiz .q { margin: 0 0 .7rem; font-weight: 600; }
    .quiz button { display: block; width: 100%; text-align: left; font: inherit; font-size: .9rem; color: var(--text);
      background: var(--bg); border: 1px solid var(--rule); border-radius: 6px; padding: .5rem .7rem; margin: .35rem 0; cursor: pointer; }
    .quiz button:hover:not(:disabled) { border-color: var(--accent); }
    .quiz button.right { border-color: var(--good); color: var(--good); font-weight: 600; }
    .quiz button.wrong { border-color: var(--bad); color: var(--bad); text-decoration: line-through; }
    .quiz .why { display: none; font-size: .86rem; margin: .7rem 0 0; color: var(--muted); }
    .quiz.answered .why { display: block; }
    .quiz-score { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .85rem; color: var(--muted); }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const quizzes = Array.from(document.querySelectorAll(".quiz"));
  let correct = 0, answered = 0;
  const score = document.querySelector(".quiz-score");

  quizzes.forEach((quiz) => {
    const buttons = Array.from(quiz.querySelectorAll("button[data-opt]"));
    const why = quiz.querySelector(".why");
    // Shuffle options in place, keeping them before the explanation
    buttons.sort(() => Math.random() - 0.5).forEach((b) => quiz.insertBefore(b, why));

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quiz.classList.contains("answered")) return;
        quiz.classList.add("answered");
        const isRight = btn.dataset.opt === quiz.dataset.answer;
        btn.classList.add(isRight ? "right" : "wrong");
        buttons.forEach((b) => {
          b.disabled = true;
          if (b.dataset.opt === quiz.dataset.answer) b.classList.add("right");
        });
        answered += 1;
        if (isRight) correct += 1;
        if (score) score.textContent = `Score: ${correct} / ${answered} answered (of ${quizzes.length})`;
      });
    });
  });
})();
