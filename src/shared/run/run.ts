export const run = async (app: string, args: string[]) => {
  const command = new Deno.Command(app, { args });
  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    throw new Error(`${app} failed: ${new TextDecoder().decode(stderr)}`);
  }

  return new TextDecoder().decode(stdout);
};
