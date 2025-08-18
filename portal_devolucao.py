# portal_devolucao.py
import eel
import datetime
import base64
import os
import uuid

UPLOADS_DIR = os.path.join('web', 'uploads')
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

from data_store import consultar_nota_fiscal, MOTIVOS_DEVOLUCAO

eel.init('web')

solicitacoes_criadas = []
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
    anexo_path = "Nenhum anexo"
    if dados_solicitacao.get('anexo_data') and dados_solicitacao.get('anexo_filename'):
        try:
            header, encoded_data = dados_solicitacao['anexo_data'].split(',', 1)
            image_data = base64.b64decode(encoded_data)
            file_extension = os.path.splitext(dados_solicitacao['anexo_filename'])[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            full_path = os.path.join(UPLOADS_DIR, unique_filename)
            with open(full_path, 'wb') as f:
                f.write(image_data)
            anexo_path = os.path.join('uploads', unique_filename).replace("\\", "/")
        except Exception as e:
            print(f"Erro ao salvar imagem: {e}")
            anexo_path = "Erro ao salvar anexo"

    nova_solicitacao = {
        "cod_solicitacao": str(id_solicitacao_counter),
        "cod_cliente": dados_solicitacao["cod_cliente"].lstrip('0'),
        "cod_item": dados_solicitacao["cod_item"],
        "motivo": dados_solicitacao["motivo"],
        "nome_cliente": dados_solicitacao["nome_cliente"],
        "data": datetime.date.today().strftime("%d/%m/%Y"),
        "material": dados_solicitacao["material"],
        "nota_fiscal": dados_solicitacao["nota_fiscal"],
        "observacao": dados_solicitacao["observacao"],
        "anexo_path": anexo_path
    }
    id_solicitacao_counter += 1
    solicitacoes_criadas.insert(0, nova_solicitacao)
    return nova_solicitacao

print("Iniciando o Portal de Devolução... Acesse a janela que abrir.")

caminho_opera_gx = r"C:\Users\Administrador\AppData\Local\Programs\Opera GX\opera.exe"
argumentos_de_inicio = ['--app', '--window-size=1440,810', '--disk-cache-dir=null', '--media-cache-size=1', '--no-cache']
eel.start('main.html', mode=caminho_opera_gx, cmdline_args=argumentos_de_inicio)