export const BASE = '/education-ai-skills/';
export const REPO = 'https://github.com/rrezartprebreza/education-ai-skills';

export function installCommand(agent, audience) {
  if (!['claude', 'codex'].includes(agent) || !['professor', 'student'].includes(audience)) {
    throw new Error('Unknown agent or audience');
  }
  return `${agent} plugin marketplace add rrezartprebreza/education-ai-skills\n${agent} plugin ${agent === 'claude' ? 'install' : 'add'} education-${audience}-skills@education-ai-skills`;
}
