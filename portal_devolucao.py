# portal_devolucao.py

import eel
import datetime
from data_store import consultar_nota_fiscal, MOTIVOS_DEVOLUCAO

eel.init('web')

solicitacoes_criadas = []
# --- CORREÇÃO: Contador de solicitações agora é um número sequencial ---
id_solicitacao_counter = 1

@eel.expose
def buscar_dados_nf(numero_nf):
    dados = consultar_nota_fiscal(numero_nf)
    if dados:
        dados['motivos_devolucao'] = MOTIVOS_DEVOLUCAO
    return dados

@eel.expose
def criar_nova_solicitacao(dados_solicitacao):
    global id_solicitacao_counter
    
    nova_solicitacao = {
        # --- CORREÇÃO: Usa o contador sequencial ---
        "cod_solicitacao": str(id_solicitacao_counter),
        # --- CORREÇÃO: Remove os zeros à esquerda do código do cliente ---
        "cod_cliente": dados_solicitacao["cod_cliente"].lstrip('0'),
        "cod_item": dados_solicitacao["cod_item"],
        "motivo": dados_solicitacao["motivo"],
        "nome_cliente": dados_solicitacao["nome_cliente"],
        "data": datetime.date.today().strftime("%d/%m/%Y"), # Data dinâmica
        "material": dados_solicitacao["material"],          # Peça dinâmica
        "nota_fiscal": dados_solicitacao["nota_fiscal"]      # NF dinâmica
    }
    id_solicitacao_counter += 1 # Incrementa para a próxima
    
    solicitacoes_criadas.insert(0, nova_solicitacao)
    print(f"Solicitação criada: {nova_solicitacao}")
    return nova_solicitacao

print("Iniciando o Portal de Devolução... Acesse a janela que abrir.")

caminho_opera_gx = r"C:\Users\Administrador\AppData\Local\Programs\Opera GX\opera.exe"
argumentos_de_inicio = ['--app', '--window-size=1440,810']
eel.start('main.html', mode=caminho_opera_gx, cmdline_args=argumentos_de_inicio)