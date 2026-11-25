// Creates a login account from the command line. Use it to make the first owner account
// on a new database (after that, the owner can add staff from the Staff page).
//
//   npm run create-user -- --username ana --name "Ana Cruz" --role owner
//
// The password is asked for (typing is hidden). For scripts, set NEW_USER_PASSWORD instead.
import { env } from '../config/env';
import mongoose from 'mongoose';
import readline from 'readline';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { createUserBody } from '../validators/user';

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let asked = false;
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    out._writeToOutput = (s: string) => {
      if (!asked) out.output.write(s); // print the question, hide what's typed
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    asked = true;
  });
}

async function main() {
  const password = process.env.NEW_USER_PASSWORD ?? (await askHidden('Password (min 8 characters): '));
  const parsed = createUserBody.safeParse({
    username: arg('username'),
    name: arg('name') ?? arg('username'),
    role: arg('role') ?? 'staff',
    password,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) console.error(`${issue.path.join('.')}: ${issue.message}`);
    console.error('Usage: npm run create-user -- --username <name> --name "<full name>" --role owner|staff');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(env.MONGODB_URI);
  const { username, name, role } = parsed.data;
  if (await User.exists({ username })) {
    console.error(`User "${username}" already exists.`);
    process.exitCode = 1;
    return;
  }
  await User.create({ username, name, role, passwordHash: await hashPassword(parsed.data.password) });
  console.log(`Created ${role} account "${username}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
