# Visão geral do SotuRail

O SotuRail é um **control plane de engenharia local-first e agent-native** para desenvolvimento de software assistido por IA.

A ideia central é:

```text
A IA entende.
O SotuRail organiza, limita e comprova.
```

O agente — Claude Code, Codex, Cursor, Gemini CLI ou outro host compatível — continua responsável por interpretar intenção, requisitos, contexto do projeto e ambiguidades. O SotuRail fornece Skills portáteis e capabilities auto-descritivas e mantém sob controle os estados que precisam de prova: identidade do workspace, provenance, freshness, evidência registrada, policy, authority e readiness.

## Para que serve

Ele ajuda a:

- trabalhar com agentes sem despejar o repositório inteiro no contexto;
- instalar Skills portáteis e carregá-las progressivamente;
- descobrir capabilities por CLI ou MCP;
- registrar hipóteses e interpretações da IA como candidates, sem promovê-las automaticamente a fatos;
- criar Change Contracts com escopo, risco, critérios e checks;
- executar checks e guardar evidência vinculada ao workspace atual;
- detectar evidência stale depois de mudanças;
- manter contexto, conhecimento e memória locais com provenance;
- controlar exposição MCP e evitar shell arbitrário;
- preparar releases com checks, SBOM, checksums e provenance.

## Instalação

Requer Node.js 22 ou superior.

```bash
npm install -g soturail
soturail --version
```

## Primeiro uso

```bash
soturail init
soturail doctor
soturail index
```

Para Claude Code:

```bash
soturail skills export --target claude --layout portable --install
```

Para Codex, Cursor ou Gemini CLI:

```bash
soturail skills export --target codex --layout portable --install
soturail skills export --target cursor --layout portable --install
soturail skills export --target gemini --layout portable --install
```

Depois converse normalmente com o agente. Ele pode descobrir Skills e capabilities sem você precisar decorar toda a CLI.

## O que o SotuRail não é

O SotuRail não é outro agente de código, provedor de modelo, proxy obrigatório de LLM, backend cloud obrigatório, sandbox do sistema operacional, gerenciador de segredos ou loop autônomo de publicação/deploy.

Veja o [README principal](../../README.md), o [Quickstart](../getting-started/quickstart.md) e a [arquitetura agent-native](../architecture/agent-native-semantic-architecture.md).
