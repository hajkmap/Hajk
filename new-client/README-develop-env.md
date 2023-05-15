# Run container from local image
docker run -p 3002:3002 \
--mount type=bind,source=/Users/perros/local/hajk-fork/new-client/public/customTheme.json,destination=/usr/app/static/client/customTheme.json \
--mount type=bind,source=/Users/perros/local/hajk-fork/new-backend/App_Data,destination=/usr/app/App_Data \
--name hajk-nacka hajk-nacka:0.5.0

# Kill Bill
docker rm hajk-nacka

# For removing any previous container before re-configuration run
docker rm hajk-nacka

# For removing Docker image
docker image rm hajk-nacka:0.5.0

# Docker image build
docker build -t hajk-nacka:0.5.0 .