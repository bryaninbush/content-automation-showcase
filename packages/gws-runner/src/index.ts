export interface GwsCommandResult {
  ok: boolean;
  command: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface GwsLoginInstruction {
  command: string;
  note: string;
}

export function buildGwsLoginInstruction(): GwsLoginInstruction {
  return {
    command: "gws auth login -s drive,sheets,docs",
    note: "Run this in the controlled operator environment. The command opens a browser-based OAuth flow for Drive, Sheets, and Docs scopes."
  };
}

export async function runGws(args: string[], cwd = process.cwd()): Promise<GwsCommandResult> {
  if (args.length === 0) {
    throw new Error("gws args cannot be empty");
  }

  const proc = Bun.spawn(["gws", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited
  ]);

  return {
    ok: exitCode === 0,
    command: ["gws", ...args],
    stdout,
    stderr,
    exitCode
  };
}
