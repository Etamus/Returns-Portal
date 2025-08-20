# portal_devolucao.py
import eel, datetime, base64, os, uuid
# --- NOVO: Imports para controlar o Excel ---
import win32com.client as win32
import threading
# --- FIM DA NOVIDADE ---

from data_store import consultar_nota_fiscal, MOTIVOS_DEVOLUCAO

UPLOADS_DIR = os.path.join('web', 'uploads')
if not os.path.exists(UPLOADS_DIR): os.makedirs(UPLOADS_DIR)
eel.init('web')

solicitacoes_criadas = []
id_solicitacao_counter = 1

# --- NOVO: Função para executar a macro do Excel ---
@eel.expose
def executar_macro_excel():
    # Defina o nome do seu arquivo e da sua macro aqui
    nome_arquivo_excel = "MinhaPlanilha.xlsm"
    nome_da_macro = "MinhaMacro"
    
    # Pega o caminho absoluto do arquivo Excel (deve estar na mesma pasta do .py)
    caminho_completo = os.path.abspath(nome_arquivo_excel)

    if not os.path.exists(caminho_completo):
        print(f"Erro: Arquivo Excel não encontrado em {caminho_completo}")
        return f"Erro: Arquivo '{nome_arquivo_excel}' não encontrado!"

    excel = None
    try:
        # Inicia uma instância do Excel em segundo plano
        excel = win32.Dispatch('Excel.Application')
        excel.Visible = False # Mantém a janela do Excel invisível

        # Abre a pasta de trabalho
        workbook = excel.Workbooks.Open(caminho_completo)
        
        # Executa a macro. O nome completo é 'NomeDoArquivo!NomeDaMacro'
        print(f"Executando macro: {nome_da_macro}")
        excel.Application.Run(f"{nome_arquivo_excel}!{nome_da_macro}")

        # Salva e fecha a planilha
        workbook.Close(SaveChanges=True)
        print("Macro executada com sucesso.")
        return "Macro executada com sucesso!"

    except Exception as e:
        print(f"Ocorreu um erro ao executar a macro: {e}")
        return f"Ocorreu um erro: {e}"
    finally:
        # Garante que o processo do Excel seja sempre fechado, mesmo se der erro
        if excel is not None:
            excel.Quit()

@eel.expose
def buscar_dados_nf(numero_nf):
    # ... (código inalterado)
    dados = consultar_nota_fiscal(numero_nf)
    if dados: dados['motivos_devolucao'] = MOTIVOS_DEVOLUCAO
    return dados

@eel.expose
def criar_nova_solicitacao(dados_solicitacao):
    # ... (código inalterado)
    global id_solicitacao_counter
    anexo_path = "Nenhum anexo"
    if dados_solicitacao.get('anexo_data') and dados_solicitacao.get('anexo_filename'):
        try:
            header, encoded_data = dados_solicitacao['anexo_data'].split(',', 1)
            image_data = base64.b64decode(encoded_data)
            file_extension = os.path.splitext(dados_solicitacao['anexo_filename'])[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            full_path = os.path.join(UPLOADS_DIR, unique_filename)
            with open(full_path, 'wb') as f: f.write(image_data)
            anexo_path = os.path.join('uploads', unique_filename).replace("\\", "/")
        except Exception as e: print(f"Erro ao salvar imagem: {e}"); anexo_path = "Erro ao salvar anexo"
    nova_solicitacao = { "cod_solicitacao": str(id_solicitacao_counter), "cod_cliente": dados_solicitacao["cod_cliente"].lstrip('0'), "cod_item": dados_solicitacao["cod_item"], "motivo": dados_solicitacao["motivo"], "nome_cliente": dados_solicitacao["nome_cliente"], "data": datetime.date.today().strftime("%d/%m/%Y"), "material": dados_solicitacao["material"], "nota_fiscal": dados_solicitacao["nota_fiscal"], "observacao": dados_solicitacao["observacao"], "anexo_path": anexo_path }
    id_solicitacao_counter += 1
    solicitacoes_criadas.insert(0, nova_solicitacao)
    return nova_solicitacao

print("Iniciando o Portal de Devolução...")
caminho_opera_gx = r"C:\Users\Administrador\AppData\Local\Programs\Opera GX\opera.exe"
argumentos_de_inicio = ['--app', '--window-size=1440,810', '--disk-cache-dir=null', '--media-cache-size=1', '--no-cache']
eel.start('main.html', mode=caminho_opera_gx, cmdline_args=argumentos_de_inicio)