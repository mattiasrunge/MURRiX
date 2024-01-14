export const run = async (tool: string, args: string[]) => {
  const command = new Deno.Command(tool, { args });
  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    throw new Error(`${tool} failed: ${new TextDecoder().decode(stderr)}`);
  }

  return new TextDecoder().decode(stdout);
};
