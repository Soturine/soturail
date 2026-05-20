# Visao geral do SotuRail

SotuRail e um Context OS local-first para agentes de IA que trabalham com codigo.

Ele ajuda a:

- indexar o repositorio sem lotar o contexto do modelo;
- ler arquivos grandes de forma progressiva;
- executar comandos com uma politica de seguranca;
- salvar logs brutos recuperaveis;
- comprimir saidas longas do terminal;
- separar blocos estaveis de dados dinamicos para prompt caching;
- manter memoria local ligada ao commit Git atual;
- comprimir respostas de agentes em modos profissionais;
- transformar documentos em regras estruturadas e validadores;
- instalar regras de hooks ou fallback prompt-only para agentes;
- gerar benchmarks locais reproduziveis;
- relatar metricas honestas.

O comando principal e:

```bash
soturail
```

No v0.2.1, os numeros de tokens, reducao e cache sao estimativas locais quando nao ha metadados reais importados. Knowledge-to-Rules e tratado como estruturacao reutilizavel, nao apenas compressao. SotuRail nao inventa acertos reais de cache de provedores.
