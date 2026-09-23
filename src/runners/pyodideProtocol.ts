export type PythonToRunner = { type: "run"; code: string };

export type RunnerToPython =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "started" }
  | { type: "done" }
  | { type: "error"; message: string };
