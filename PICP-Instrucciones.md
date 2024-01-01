Desde el clone inicial, primero actualizaremos las dependencias, no incluidas en el repo:

cd API-CNIG/api-ign-js/src/
npm i -g npm-check-updates
npm i npm-check-updates
npm run build

cd plugins/incicarto/
npm i -g npm-check-updates
npm i npm-check-updates


- Para compilar plugin incicarto:

npm run build

copiamos el resultado despues al proyecto, ya en modo plugin:

cp dist/* ../../../../../PICP-APICNIG/src/assets/

cd ../
cd fulltoc/ 
npm i -g npm-check-updates
npm i npm-check-updates

- para compilar el plugin fulltoc

npm run build

NOTA: Falla con 
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'

Workaround: Utilizar las compilaciones de guadaltel con maven

cd ../
cd vectors

npm i -g npm-check-updates
npm i npm-check-updates

- para compilar el plugin vectors

npm run build

Nota: FALLA:   opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'

  Workaround: usar compilado maven guadaltel

Seguimos con el proceso preparando el webpack, vamos a la ruta:

cd ../../../../../PICP-APICNIG/

npm i -g npm-check-updates
npm i npm-check-updates
npm run build

Para publicar, accedemos al "Administrador de archivos para visor.picp.es": https://a0207.abansys.com:8443/smb/file-manager/list/domainId/180

Desde allí, eliminamos todo el contenido, y cargamos el contenido de la carpeta PICP-APICNIG\dist\

Para android, desde la carpeta PICP-APICNIG:

Build:
npx ionic build && npx cap copy

Sync:
npx cap sync --inline

Si no se ha añadido, hay que añadir Android:
https://capacitorjs.com/docs/android#adding-the-android-platform
npx cap add android


Abrir android studio:
 npx cap open android
 
 preparar APK:



