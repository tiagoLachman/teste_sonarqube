const { createLogger, format, transports } = require('winston');
const retrieveSecrets = require("../aws/aws_get_secret.js")

module.exports = new Promise(async (resolve, reject) => {
  retrieveSecrets("DD_API_KEY_SECRET").then(data => {
    //Logger name
    const service_name = "app_auto_deploy";

    const httpTransportOptions = {
      host: 'http-intake.logs.datadoghq.com',
      path: `/api/v2/logs?dd-api-key=${data}&ddsource=nodejs&service=${service_name}`,
      ssl: true
    };

    const logger = createLogger({
      exitOnError: false,
      format: format.json(),
      transports: [
        new transports.Http(httpTransportOptions),
      ],
    });
    logger.info("Logger inicializado")
    resolve(logger);
    return;
  }).catch(err => {
    reject(err);
  })

})