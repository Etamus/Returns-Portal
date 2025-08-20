# Returns Portal

Portal de Devolução desenvolvido para uma empresa logística de peças.  
Este sistema permite registrar, acompanhar e gerenciar solicitações de devolução de forma simples e eficiente, trazendo rastreabilidade e transparência ao processo.

---

## Funcionalidades

- **Cadastro de novas solicitações de devolução**
  - Informar número da Nota Fiscal
  - Selecionar itens para devolução
  - Escolher motivo de devolução
  - Inserir observações adicionais
  - Anexar imagens dos itens

- **Acompanhamento de solicitações criadas**
  - Lista organizada de solicitações
  - Filtros por cliente, NF, motivo ou material
  - Visualização detalhada com observações e anexos

- **Carrinho de devoluções**
  - Seleção de múltiplos itens antes de envio
  - Possibilidade de cancelar ou finalizar em lote

- **Upload de imagens**
  - Armazena os anexos em diretório dedicado (`/web/uploads`)
  - Nomeação única para evitar conflitos

---

## Tecnologias Utilizadas

- **Backend:** [Python](https://www.python.org/) com [Eel](https://github.com/python-eel/python-eel) (integração Python + HTML/JS)
- **Frontend:** HTML5, CSS3, JavaScript (DOM + eventos dinâmicos)
- **Bibliotecas JS:** 
  - [Flatpickr](https://flatpickr.js.org/) (datas)
  - [Feather Icons](https://feathericons.com/) (ícones)
- **Gerenciamento de anexos:** `base64`, `uuid`, `os`

---

## Como Executar

### Pré-requisitos
- Python 3.8+
- Navegador (caminho configurado no código)

### Instalação
1. Clone este repositório:
   ```bash
   git clone https://github.com/Etamus/Returns-Portal.git
   cd Returns-Portal
   ```

3.  Crie um ambiente virtual e instale as dependências:
    ```bash
    pip install eel
    ```

4.  Execução:
    ```bash
    python portal_devolucao.py
    ```