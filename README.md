# Fahrtenbuch



## Deployment

```bash
./gradlew build && \
  docker build --build-arg JAR_FILE=build/libs/drives-0.0.1-SNAPSHOT.jar -t drives:0.0.1-SNAPSHOT . && \
  docker save drives -o drives.tar && \
  scp drives.tar root@evcc-box.schrell.de:
```
und auf Server-Seite
```bash
docker load -i ~/drives.tar && \
  pushd /opt/drives-as && \
  docker compose up -d && \
  popd && \
  pushd /opt/drives-tas && \
  docker compose up -d && \
  popd
```