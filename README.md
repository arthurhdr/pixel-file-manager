# pixel-file-manager

Aplicação web para armazenamente e gerenciamento de arquivos.

## Menu

- [Propósito](#pixel-file-manager)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Instalação e execução](#instalação-e-execução)
    - [Requisítos](#requisítos)
    - [Instalação](#instalação)
    - [Execução](#execução)
- [Utilização](#utilização)
    - [Utilizando o backend](#utilizando-o-backend)
    - [Utilizando o MinIO Console](#utilizando-o-minio-console)
    - [Utilizando o frontend](#utilizando-o-frontend)
- [Endpoints](#endpoints)
    - [Authentication](#authentication)
    - [Files](#files)
- [Arquitetura e decisões técnicas](#arquitetura-e-decisões-técnicas)
    - [Arquitetura do backend](#arquitetura-do-backend)
    - [Arquitetura do frontend](#arquitetura-do-frontend)
- [Funcionalidades](#funcionalidades)
    - [Autenticação](#autenticação)
    - [Página principal](#página-principal)
    - [Upload de arquivos](#upload-de-arquivos)
    - [Download de arquivos](#download-de-arquivos)
    - [Exclusão de arquivos](#exclusão-de-arquivos)
    - [Funcionalidades adicionais](#funcionalidades-adicionais)


## Tecnologias utilizadas

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![SQLAlchemy](https://img.shields.io/badge/sqlalchemy-%23D71F00.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Pydantic](https://img.shields.io/badge/pydantic-%23E92063.svg?style=for-the-badge&logo=pydantic&logoColor=white)

## Instalação e execução

### Requisítos

- Docker
- Git

### Instalação

Primeiro é necessário clonar o repositório e acessar ele para execução. Na pasta que deseja instalar o repositório acesse o terminal

```bash
git clone https://github.com/arthurhdr/pixel-file-manager
```

e mude para a pasta do programa

```bash
cd pixel-file-manager
```

Crie também o arquivo .env conforme as especificações do arquivo .env.example

### Execução

Para executar o programa é necessário ter o Docker instalado e aberto, na pasta do repositório (A pasta aonde está o docker-compose.yml) execute no terminal:

```bash
docker-compose up --build
```

Espere os contêineres serem inicializados e então o programa poderá ser usado

## Utilização

Por padrão, as portas do frontend, backend e do console do MinIO são respectivamente 5173, 8000 e 9001.

### Utilizando o backend

Ao acessar a porta do backend na rota /docs o usuário tem acesso aos endpoints da aplicação e poderá enviar as HTTP Requests para cada uma delas conforme suas regras. Os endpoints também podem ser acessados diretamente seguindo as rotas dadas na seção [endpoints](#endpoints).

### Utilizando o MinIO Console

Para se ter acesso aos arquivos do site no MinIO por meio do MinIO console é necessário acessar a porta 9000 e no login colocar as informações do .env. No MinIO Console é possível ver os arquivos de cada usuário, compartilhar, baixar, apagar e gerenciar.


### Utilizando o frontend

Para usar o frontend acesse a porta 5173, o usuário será imediatamente redirecionado para a página de login, caso o registro de usuário não tenha sido feito ainda é necessário criar um usuário na página de registro, que pode ser acessado clicando no botão "Cadastre-se" da página de login.

O usuário logado tem acesso a seu perfil isolado, com todos os arquivos que ele subir e podendo ver suas ver~sos, compartilhar um link de download temporário, deletar e ver o preview de fotos upadas.

## Endpoints

Os endpoints da API são divididos em dois tipos: Os authentication, para autenticação e verificação de usuário, e o files para gerenciar os arquivos do site

### Authentication 

|      Path      | Method |               Função               |
|:--------------:|:------:|:----------------------------------:|
|   /auth/login  |  POST  |            Logar usuário           |
| /auth/register |  POST  |         Registra o usuário         |
|    /auth/me    |   GET  | Consulta o estado do usuário atual |

### Files

|                  Path                 | Method |                       Função                       |
|:-------------------------------------:|:------:|:--------------------------------------------------:|
|             /files/upload             |  POST  |              Faz upload de um arquivo              |
|                /files/                |   GET  |                  Lista os arquivos                 |
|       /files/{file_id}/download       |   GET  |               Faz download do arquivo              |
|         /files/{file_id}/share        |   GET  | Gera um link compartilhável de download do arquivo |
| /files/versions/{version_id}/download |   GET  |            Faz o download de uma versão            |
|            /files/{file_id}           | DELETE |      Deleta um arquivo e todas as suas versões     |
|      /files/versions/{version_id}     | DELETE |           Deleta uma versão de um arquivo          |


## Arquitetura e decisões técnicas

A arquitetura do programa foi planejada para visar o programa mais eficiente, compacto, organizado e prezando pelos princípios do clean code, para fazer ele ter fácil entendimento e manutenção.

A pasta principal do programa contém a pasta do backend, a pasta do frontend e o docker-compose.yml, responsável por orgasnizar os contêineres, tornando o programa executável facilmente em qualquer máquina. 

### Arquitetura do backend

Para o backend eu decidi utilizar o framework FastAPI, devido a sua facilidade de uso, sua performance excepcional, documentação interativa automática, ter um sistema de injeção de dependências poderoso e de fácil uso e por sua compatibilidade com múltiplas ferramentas.

O backend se organiza da seguinte forma:

```
backend/
├── app/
│   ├── routers/
│   │   ├── auth.py
│   │   └── files.py
│   ├── services/
│   │   ├── cache.py
│   │   └── storage.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
├── Dockerfile
└── requirements.txt
```

O Dockerfile é o responsável por organizar o container do backend, o requirements.txt possui todas as bibliotecas necessárias que são usadas pelo Python no backend e a pasta app organiza o backend da aplicação.

Na pasta routers estão organizados as rotas da API e quais ações são realizadas na databse do programa. Para a database escolhi a SQLite por ser leve, rápida, não necessitar de configuração, ser self-contained e de fácil uso, para isso usei também o toolkit SQLAlchemy do Python para interagir mais facilmente com a database. Os modelos dos objetos inseridos nas tabelas da database podem ser encontrados no arquivo models na pasta princípal e os Schemas de validação no arquivo schemas.py na pasta app.

O arquivo auth.py na pasta routers gerencia as rotas relacionadas as requests de usuário: Login, registro e conexão. O arquivo files.py gerencia as rotas relacionadas as requests de arquivo: Criação, deleção, compartilhamento, download e versionamento. Três tabelas são criadas na database: A users, a files e a file_versions, que gerencia as versões dos aplicativos e as informações básicas da aplicação, como tamanho, tipo, nome etc.

A pasta services é responsável por organizar a lógica de negócio e as integrações, o arquivo cache.py é responsável pelo serviço de cache da aplicação e utiliza do Redis. O storage.py gerencia os arquivos no armazenamento. Como meio de armazenar os arquivos utilizei o MinIO por sua alta performance, compatibilidade com S3 e por sua praticidade.  

Já os outros arquivos na pasta app são o auth.py, responsável por manter a segurança de acesso e autenticação do usuário, database.py responsável por configurar a database e o main.py, que é o 'motor' principal do backend, integrando tudo.

### Arquitetura do frontend

Para o frontend foi utilizado TypeScript + React com Tailwind na estilização e visual, devido a sua facilidade de uso e visuais atraentes.

O frontend se organiza dessa forma:

```
frontend/
├── src/
│   ├── components/
│   │   ├── ImagePreviewModal.tsx
│   │   ├── Layout.tsx
│   │   └── UploadModal.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── Dockerfile
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

Na pasta princípal do frontend está o Dockerfile responsável pela criação do container do frontend e o index.html, o ponto de entrada da aplicação que chama o main.tsx e é o arquivo que unifica todo o frontend.

A pasta src é organizada de forma a separar os arquivos por suas respectivas funções. Na pasta components estão os componentes visuais do frontend. O ImagePreviewModal.tsx é o modal para mostrar o preview da imagem quando o usuário requerer. O layout.tsx é o layout básico de todas as páginas. O UploadModal.tsx é o modal de upload dos arquivos

A pasta lib armazena configurações de bibliotecas externas e utilitários da aplicação. o api.ts configura o axios para chamadas do backend. O utils.ts contém váriasfunções auxiliares genéricas (Esse arquivo diminui em quase 100 linhas o Home.tsx e facilitou muito a manutenção).

A pasta pages contém as páginas da aplciação: A página de login, de registro e a página principal. A pasta Store contém o arquivo que controla se o usuário está logado e armazena o token da sessão.

Na pasta src em si há o index.css que unifica o visual, o App.tsx que gerencia o roteamento e a estrutura principal e o main.tsx, que renderiza o TS no HTML

## Funcionalidades

Todas as funcionalidades, obrigatórias e opcionais foram implementadas com sucesso nessa aplicação

### Autenticação

- Cadastro e login de usuários de forma segura
- Permanência do usuário durante o uso da aplicação
- Ambientes isolados para cada usuário

### Página principal

- Exibe os arquivos enviados pelo usuário logado com nome do arquivo, tamanho, versão e data de upload
- Ações disponíveis: Preview para imagens, download, deletar, comaprtilhar link de download e ver versões do mesmo arquivo (Com versões anteriores tendo funções de download e deletar)

### Upload de arquivos

- Upload via modal no frontend
- Restrições de upload: Arquivos de no máximo 10 MB com apenas arquivos .txt, .pdf, .jpeg, .jpg, .png e .txt permitidos.
- Feedback visual: Tela de carregamento, sucesso, ou erro

### Download de arquivos

- O usuário só pode baixar arquivos que ele mesmo tem em seu perfíl ou com links de compartilhamento de download 
- O arquivo serve o arquivo original com streaming
- O usuário pode baixar qualquer versão de um mesmo arquivo

### Exclusão de arquivos

- O usuário só pode excluir arquivos que ele mesmo enviou
- O arquivo desaparece após a exclusão
- A exclusão é feita por meios lógicos (Soft Delete)

### Funcionalidades adicionais

- Backend com APIs para: Autenticação, upload de arquivos, listagem de arquivos, download de arquivos e exclusão de arquivos
- Arquivos como Metadata armazenada no banco contendo: ID, Usuário dono, nome original, nome no storage, tipo MIME, tamnanho, data de criação e se está ou não deletado
- Implementação de cache para tornar a aplicação mais eficiente
- Armazenamento utilizando MinIO
- Dockerização da aplicação