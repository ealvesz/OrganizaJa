# OrganizaJá — Controle de Despesas Pessoais

Projeto acadêmico desenvolvido em **React Native** com **Expo** e JavaScript.

## 1. Problema que o aplicativo procura resolver

Muitas pessoas fazem pequenas compras durante o mês e depois têm dificuldade para lembrar quanto gastaram e em quais categorias. O OrganizaJá permite registrar essas despesas e compará-las com um limite mensal definido pelo próprio usuário.

## 2. Funcionalidades

- **Painel inicial:** mostra o total gasto no mês, o orçamento definido e o valor que ainda está disponível.
- **Cadastro de despesas:** registra descrição, valor e categoria.
- **Edição e exclusão:** permite corrigir ou remover um lançamento.
- **Categorias:** alimentação, transporte, moradia, lazer, saúde, educação e outros.
- **Histórico:** lista os lançamentos e permite pesquisar pela descrição e filtrar por categoria.
- **Orçamento mensal:** permite definir ou alterar o limite de gastos e visualizar o percentual utilizado.
- **Resumo por categoria:** apresenta quanto foi gasto em cada categoria no mês atual.
- **Armazenamento local:** usa AsyncStorage para manter os registros no aparelho mesmo depois de fechar o aplicativo.
- **Validação:** verifica a descrição e o valor antes de salvar.

O aplicativo começa sem despesas cadastradas. Assim, os primeiros registros são feitos durante o teste ou a demonstração.

## 3. Tecnologias utilizadas

- React Native
- Expo SDK 54
- JavaScript
- AsyncStorage (`@react-native-async-storage/async-storage`)

## 4. Como executar no celular

1. Instale o **Node.js LTS** no computador.
2. Instale o **Expo Go** no iPhone ou Android.
3. Extraia o arquivo ZIP.
4. Abra a pasta `OrganizaJa` no terminal.
5. Execute `npm install`.
6. Execute `npx expo start`.
7. Leia o QR Code com a câmera do iPhone ou pelo Expo Go no Android.

Se o celular e o computador não se conectarem pela rede local, tente `npx expo start --tunnel`.

## 5. Roteiro para testar as funcionalidades

1. Abra o aplicativo e confira o painel vazio.
2. Toque em **Adicionar despesa**.
3. Cadastre, por exemplo, `Almoço`, valor `28,50`, categoria `Alimentação`.
4. Cadastre outra despesa em uma categoria diferente.
5. Abra **Histórico**, pesquise pela descrição e teste o filtro de categoria.
6. Edite uma despesa e confira se o valor foi atualizado.
7. Exclua um lançamento e confirme a exclusão.
8. Abra **Orçamento**, altere o limite mensal e confira o valor disponível.
9. Feche e abra o aplicativo novamente para verificar se os dados continuam salvos.

## 6. Como explicar o funcionamento

O estado da aplicação é controlado com os hooks `useState`, `useEffect` e `useMemo`. Os lançamentos ficam em uma lista de objetos JavaScript. Cada objeto guarda um identificador, descrição, valor, categoria e data de criação.

O total mensal é calculado somando os lançamentos cuja data pertence ao mês atual. O valor disponível é o orçamento menos o total gasto. O AsyncStorage salva a lista de despesas e o orçamento no armazenamento local do aparelho.

## 7. Roteiro sugerido para o vídeo de 30 segundos

- **0–5 s:** mostrar a tela inicial e explicar que o app organiza despesas pessoais.
- **5–12 s:** cadastrar uma despesa com descrição, valor e categoria.
- **12–18 s:** mostrar o lançamento no histórico e pesquisar ou filtrar.
- **18–24 s:** editar ou excluir um lançamento.
- **24–30 s:** mostrar o orçamento mensal e o valor disponível.

Grave a tela do aplicativo em execução no Expo Go. O vídeo deve mostrar a navegação real, e não apenas imagens ilustrativas.

## 8. Limites do projeto

Este é um protótipo acadêmico de controle de despesas. Os dados ficam armazenados localmente no aparelho; não há login, sincronização em nuvem ou integração bancária. O orçamento é um limite informado pelo usuário, não uma consulta à conta bancária.

## 9. Como gravar a tela no iPhone

1. Abra a Central de Controle.
2. Toque no botão **Gravação da Tela**. Se ele não aparecer, adicione o controle em Ajustes > Central de Controle.
3. Volte ao Expo Go e faça a demonstração seguindo o roteiro acima.
4. Pare a gravação pelo indicador vermelho ou pela Central de Controle.
5. Confira o vídeo antes de anexar ao AVA. Procure mostrar texto legível, sem notificações pessoais na tela.
