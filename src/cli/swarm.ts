import chalk from 'chalk';
import ora from 'ora';
import { runSwarm, SwarmEvent } from '../pipeline/orchestrator.js';

export async function swarmCommand(
  specUrl: string,
  options: { replay?: boolean; provider?: 'groq'; output?: string; lang?: 'ts' | 'py' }
): Promise<void> {
  const { replay = false, provider, output, lang = 'ts' } = options;

  const spinner = ora('Initializing swarm...').start();

  const events: SwarmEvent[] = [];

  const handleEvent = (event: SwarmEvent) => {
    events.push(event);
    switch (event.type) {
      case 'stage_start':
        spinner.text = chalk.cyan(`▶ ${event.stage}: ${event.message}`);
        break;
      case 'stage_complete':
        spinner.text = chalk.green(`✓ ${event.stage}: ${event.message}`);
        break;
      case 'stage_error':
        spinner.fail(chalk.red(`✗ ${event.stage}: ${event.error}`));
        break;
      case 'progress':
        spinner.text = chalk.yellow(`⟳ ${event.message}`);
        break;
      case 'info':
        spinner.text = chalk.blue(`ℹ ${event.message}`);
        break;
    }
  };

  try {
    const outputPath = await runSwarm(specUrl, { replay, provider, outputDir: output, lang }, handleEvent);
    spinner.succeed(chalk.green(`✓ Swarm completed successfully!`));
    console.log(chalk.gray(`\nOutput: ${outputPath}`));
    console.log(chalk.gray(`Run: cd ${outputPath} && npm install && npm start`));
  } catch (error) {
    spinner.fail(chalk.red('✗ Swarm failed'));
    throw error;
  }
}