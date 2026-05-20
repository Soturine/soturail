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
- relatar metricas honestas.

O comando principal e:

```bash
soturail
```

No v0.1.0, os numeros de tokens e cache sao estimativas locais. SotuRail nao inventa acertos reais de cache de provedores.
