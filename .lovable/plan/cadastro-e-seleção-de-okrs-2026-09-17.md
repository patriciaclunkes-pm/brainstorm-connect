# Cadastro e seleção de OKRs

## Objetivo
Permitir que RH e administradores gerenciem OKRs como já fazem com categorias, e que o colaborador associe opcionalmente um OKR ao cadastrar ou editar uma ideia.

## Alterações
- Criar o cadastro de OKRs com nome, situação ativa/inativa, criação, edição e listagem.
- Adicionar o acesso **OKRs** à navegação de RH e administradores.
- Incluir um campo opcional de OKR no cadastro da ideia, mostrando apenas OKRs ativos.
- Incluir o mesmo campo na edição, preservando a opção já vinculada mesmo se ela tiver sido inativada.
- Exibir o OKR associado no detalhe da ideia, quando houver.
- Manter categoria obrigatória e OKR opcional, sem alterar status ou demais regras da ideia.

## Validação
- Confirmar criação, edição e ativação/inativação de OKRs.
- Confirmar cadastro e edição de ideias com e sem OKR.
- Confirmar que OKRs inativos não aparecem em novas seleções.
- Verificar a experiência em tela grande e celular.

## Detalhes técnicos
- Criar a estrutura de OKRs com as mesmas permissões de categorias e vínculo opcional nas ideias.
- Atualizar os tipos gerados e as consultas de criação, edição e detalhe.
- Validar no servidor que um novo vínculo utiliza um OKR ativo e registrar alterações na auditoria.