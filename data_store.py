# data_store.py
DADOS_NOTAS_FISCAIS = {
    "10184586": {
        "cod_cliente": "0000005039",
        "nome_cliente": "MAQ TEC COMERCIO DE PECAS",
        "itens": [
            {"material": "W11300698", "cod_item": "00038532 - 000", "descricao": "MECANISMO KIT", "subfamilia": "Mecanismos", "qtde_total": 4, "qtde_disponivel": 3},
            {"material": "W10347201", "cod_item": "00038531 - 000", "descricao": "PRATELEIRA MULTIUSO SERIG NA (C+F)", "subfamilia": "Prateleiras", "qtde_total": 10, "qtde_disponivel": 10}
        ]
    }
}
MOTIVOS_DEVOLUCAO = [
    "(90) - Não solicitou a peça", "(177) - Defeito Funcional - Ruído",
    "(167) - Avaria Quebrada", "(104) - Código Trocado",
]
def consultar_nota_fiscal(numero_nf): return DADOS_NOTAS_FISCAIS.get(numero_nf, None)