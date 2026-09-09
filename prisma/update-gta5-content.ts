import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const content = readFileSync('/tmp/current_content.txt', 'utf-8');
  const updated = await prisma.post.update({
    where: { slug: 'nintendo-switch-oled-s-gta-5' },
    data: { content },
  });
  console.log('Updated:', updated.slug);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
