
############################################
# Stage 1: Build (Ubuntu 22.04 + Emscripten)
############################################
FROM ubuntu:22.04 AS builder

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates curl unzip xz-utils \
    python3 python3-pip python3-setuptools \
    cmake ninja-build build-essential pkg-config \
 && rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
WORKDIR /opt
RUN git clone https://github.com/emscripten-core/emsdk.git \
 && cd emsdk \
 && ./emsdk install latest \
 && ./emsdk activate latest

ENV EMSDK=/opt/emsdk
ENV PATH=/opt/emsdk:/opt/emsdk/upstream/emscripten:${PATH}
ENV EMSCRIPTEN=/opt/emsdk/upstream/emscripten
SHELL [ "/bin/bash", "-lc" ]
RUN source /opt/emsdk/emsdk_env.sh && emcc -v

# Copy project
WORKDIR /src
# 仅复制构建所需文件，避免将 docker/、build/、lib/、include/ 等带入镜像
COPY CMakeLists.txt /src/CMakeLists.txt
COPY meshlib-config.cmake.in /src/meshlib-config.cmake.in
COPY cmake /src/cmake
COPY source /src/source
COPY thirdparty /src/thirdparty
COPY scripts /src/scripts
COPY wasm /src/wasm
COPY server.py /src/server.py

# Bring git metadata to allow submodule update inside container
COPY .gitmodules /src/.gitmodules
COPY .git /src/.git

# Ensure submodules are present (e.g., thirdparty/draco, libE57Format deps)
RUN git config --global --add safe.directory /src \
 && git -C /src submodule sync --recursive \
 && git -C /src submodule update --init --recursive

# Build env (non-interactive, wasm64)
ENV MR_STATE=DOCKER_BUILD \
    MR_EMSCRIPTEN=ON \
    MR_EMSCRIPTEN_WASM64=1 \
    MR_EMSCRIPTEN_SINGLETHREAD=0 \
    MESHLIB_BUILD_RELEASE=ON \
    MESHLIB_BUILD_DEBUG=OFF

# Build thirdparty and source
RUN source /opt/emsdk/emsdk_env.sh && ./scripts/build_thirdparty.sh
RUN source /opt/emsdk/emsdk_env.sh && ./scripts/build_source.sh


############################################
# Stage 2: Runtime (serve wasm via server.py)
############################################
FROM python:3.11-slim AS runtime

WORKDIR /app/wasm

# Static wasm assets
COPY --from=builder /src/wasm /app/wasm
# Build outputs (wasm/js/glue expected in bin)
COPY --from=builder /src/build/Release/bin /app/wasm/bin
# Custom server with COEP/COOP headers
COPY --from=builder /src/server.py /app/wasm/server.py

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

CMD ["python3", "server.py"]


