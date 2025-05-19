#!/usr/bin/env node
/**
 * @module bin/avr-qa-scaffold.js
 * @version 0.1.0
 * @author Alejandro Valencia <dev@alejandrovr.com>
 * @description
 * Command line interface to quickly set up code quality tools
 * for Node.js, React.js, or Next.js projects
 * 
 * @status READY (READY|REVIEW_NEEDED|IN_PROGRESS)
 * @createdAt 2025-05-09
 * @lastModified 2025-05-09
 * @modifiedBy Alejandro Valencia <dev@alejandrovr.com>
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { VERSION } from '../lib/utils.js';
import { setup, init } from '../lib/index.js';

// Get package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create program
const program = new Command();

program
  .name('avr-qa-scaffold')
  .description('Quickly set up code quality tools for Node.js, React, or Next.js projects')
  .version(VERSION);

// Default command: set up quality tools in current project
program
  .option('-t, --type <type>', 'Project type (node, react, next)', 'node')
  .option('-f, --force', 'Override existing configurations', false)
  .option('-s, --skip-install', 'Skip installing npm dependencies', false)
  .option('-v, --verbose', 'Show detailed output during setup', false)
  .action(async (options) => {
    console.log(chalk.blue.bold('AVR Quality System Scaffold'));
    console.log(chalk.dim('Setting up quality tools for your project...\n'));
    
    await setup({
      projectType: options.type,
      force: options.force,
      skipInstall: options.skipInstall,
      verbose: options.verbose
    });
  });

// Init command: create a new project with quality tools
program
  .command('init [directory]')
  .description('Initialize a new project with quality tools')
  .option('-t, --type <type>', 'Project type (node, react, next)', 'node')
  .option('-v, --verbose', 'Show detailed output during initialization', false)
  .action(async (directory, options) => {
    console.log(chalk.blue.bold('AVR Quality System Scaffold - Project Initialization'));
    
    await init({
      projectType: options.type,
      directory: directory || '.',
      verbose: options.verbose
    });
  });

// List command: show available project types and templates
program
  .command('list')
  .description('List available project types and templates')
  .action(() => {
    console.log(chalk.blue.bold('AVR Quality System Scaffold - Available Options'));
    
    console.log(chalk.yellow.bold('\nProject Types:'));
    console.log(` - ${chalk.green('node')}:  Node.js applications or libraries`);
    console.log(` - ${chalk.green('react')}: React applications`);
    console.log(` - ${chalk.green('next')}:  Next.js applications`);
    
    console.log(chalk.yellow.bold('\nFeatures included:'));
    console.log(` - ${chalk.green('✓')} ESLint with Airbnb config variations & other plugins`);
    console.log(` - ${chalk.green('✓')} Prettier for consistent formatting`);
    console.log(` - ${chalk.green('✓')} Husky for Git hooks`);
    console.log(` - ${chalk.green('✓')} lint-staged for efficient linting`);
    console.log(` - ${chalk.green('✓')} Commitizen & commitlint for standardized commits`);
    console.log(` - ${chalk.green('✓')} Jest for testing`);
    
    console.log(chalk.yellow.bold('\nUsage examples:'));
    console.log(` - ${chalk.cyan('npx avr-qa-scaffold')} - Set up quality tools in current Node.js project`);
    console.log(` - ${chalk.cyan('npx avr-qa-scaffold --type react')} - Set up for React project`);
    console.log(` - ${chalk.cyan('npx avr-qa-scaffold init my-project')} - Create new Node.js project`);
    console.log(` - ${chalk.cyan('npx avr-qa-scaffold init my-app --type next')} - Create new Next.js project`);
  });

// Parse command line arguments
program.parse(process.argv);