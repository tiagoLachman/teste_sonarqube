# Auto Deploy

## Configuração

### Instalação das dependencias

```bash
npm i
```

### Key's do IAM

- Coloque as seguintes informações em Secrets do GitHub:
  - Sua `acess key ID` com o nome da Secret de `AWS_ACCESS_KEY_ID`
  - Sua `secret access key` com o nome da Secret de `AWS_SECRET_ACCESS_KEY`
  - Sua `account ID` com o nome da Secret de `AWS_ID`

### Dockerfile

- Adicione ou remova portas que o seu APP precisa no [Dockerfile](Dockerfile), exemplo:

```dockerfile
#PORTS------------------------------

#EXPOSE 80
EXPOSE 22
EXPOSE 443

#PORTS------------------------------
```

## AWS Secrets

- Instale o aws-sdk:

  ``` bash
  npm i aws-sdk
  ```

- Caso a região seja diferente de `us-east-1`, atualize-a no [aws_get_secret.js](/aws/aws_get_secret.js)

### Adicionar uma Secret no AWS

- Para adicionar uma secret execute o comando abaixo:

```bash
aws secretsmanager create-secret --name nomeSecret --description "teste secret"  --secret-string "minha_chave_secreta"
```

## DATADOG

- Configurações do DataDog no arquivo [config.js](logger/config.js).

- Caso esteja utilizando o AWS Secrets para armazenar sua API key do DataDog utilize o arquivo [logger_aws_secrets.js](logger/logger_aws_secret.js), atualizando o nome da sua secret na constante `DD_key_name` no [arquivo config](logger/config.js).
- Caso contrario utilize o [logger.js](logger/logger.js) alterando o `dd_api_key` com a sua API key do DataDog no [config](logger/config.js).
