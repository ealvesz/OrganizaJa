# Roteiro de apresentação — OrganizaJá

## Explicação oral (aproximadamente 1 minuto)

"O meu projeto se chama OrganizaJá e é um aplicativo de controle de despesas pessoais. A ideia surgiu de uma situação comum: às vezes fazemos vários gastos pequenos durante o mês e perdemos a noção de quanto já foi gasto.

No aplicativo, o usuário pode cadastrar uma despesa, informar o valor e escolher uma categoria. Também pode consultar o histórico, pesquisar lançamentos, filtrar por categoria, editar ou excluir uma despesa.

Outra função é o orçamento mensal. O usuário define um limite e o aplicativo calcula o total gasto e quanto ainda está disponível. Os dados são salvos no próprio aparelho usando AsyncStorage.

O objetivo é oferecer uma forma simples de acompanhar os gastos do dia a dia. Como é um protótipo acadêmico, ele não acessa contas bancárias nem sincroniza dados pela internet."

## Perguntas que podem aparecer

**Por que escolheu esse problema?**

Porque controlar pequenos gastos é uma necessidade comum e o aplicativo permite visualizar as despesas de forma organizada.

**Como os dados são salvos?**

Com AsyncStorage, uma biblioteca de armazenamento local para aplicativos React Native.

**O que acontece quando o usuário altera o orçamento?**

O aplicativo atualiza o limite e recalcula o valor disponível com base nas despesas do mês atual.

**O aplicativo funciona sem internet?**

Depois de instalado e aberto, as funções principais usam dados locais e não precisam de conexão com a internet.

**Quais são as limitações?**

Não há login, integração com banco, sincronização em nuvem ou compartilhamento entre aparelhos.
