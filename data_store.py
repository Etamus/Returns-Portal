# data_store.py

# Simula uma tabela de notas fiscais no sistema
DADOS_NOTAS_FISCAIS = {
    "10184586": {
        "cod_cliente": "5039",
        "nome_cliente": "MAQ TEC COMERCIO DE PECAS",
        "itens": [
            {
                "material": "W11300698",
                "descricao": "MECANISMO KIT",
                "qtde_total": 4,
                "qtde_disponivel": 3,
            },
            # Poderiam haver outros itens nesta mesma nota fiscal
        ]
    }
}

# Simula os motivos de devolução que podem ser escolhidos
MOTIVOS_DEVOLUCAO = [
    "90 (Não Solicitou a Peça)",
    "177 (Defeito Funcional - Ruído)",
    "167 (Avaria Quebrada)",
    "104 (Código Trocado)",
]


def consultar_nota_fiscal(numero_nf):
    """Função que simula a busca dos dados da NF no sistema."""
    return DADOS_NOTAS_FISCAIS.get(numero_nf, None)