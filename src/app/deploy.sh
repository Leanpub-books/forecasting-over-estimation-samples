# run with: source deploy.sh
# only then will the cd at the end work

deno bundle main.ts > ../../deploy/forecast.js
cp sample*.csv ../../deploy
cd ../../deploy
