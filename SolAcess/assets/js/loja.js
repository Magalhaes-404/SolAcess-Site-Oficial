/*
 * CONFIGURAÇÃO DA LOJA E DOS CONTATOS — edite somente este arquivo.
 *
 * Enquanto `vendasAbertas` for false, os botões de compra NÃO levam a nenhum pagamento:
 * eles abrem um aviso explicando que o SolAcess está em desenvolvimento.
 *
 * Para abrir as vendas:
 *   1. preencha `preco` e `checkoutUrl` de cada produto (link da loja / checkout);
 *   2. troque `vendasAbertas` para true.
 *
 * Campos com null aparecem no site como "A definir".
 */
window.SOLACESS_LOJA = {
  vendasAbertas: false,

  produtos: {
    protetor: { nome: "Protetor SolAcess",       preco: "R$ 49,90", checkoutUrl: null },
    kit:      { nome: "Kit Protetor + Refil",    preco: "R$ 64,90", checkoutUrl: null },
    refil:    { nome: "Refil SolAcess",          preco: "R$ 24,90", checkoutUrl: null }
  },

  // Link para acompanhar o lançamento (lista de espera, formulário, Instagram...).
  // Se ficar null, o aviso leva para a seção de contato.
  avisoUrl: null,

  // Canais de contato. Deixe null para mostrar "A definir".
  // Os contatos sugeridos antes ainda não foram confirmados pela equipe, então o site mostra "A definir".
  // Quando tiver os contatos reais, troque null pelo valor, por exemplo:
  //   email: "contato@solacess.com.br",
  //   whatsapp: "5511999998888",        (DDI + DDD + número, só números)
  //   instagram: "solacess.oficial"
  contato: {
    email: null,
    whatsapp: null,
    instagram: null
  }
};
