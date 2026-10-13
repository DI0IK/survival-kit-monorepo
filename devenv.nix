{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  env = {
    JWT_SECRET = config.secretspec.secrets.JWT_SECRET or "";
    JWT_EXPIRATION = config.secretspec.secrets.JWT_EXPIRATION or "";
    POSTGRES_NAME = config.secretspec.secrets.POSTGRES_NAME or "survival-kit";
    POSTGRES_USER = config.secretspec.secrets.POSTGRES_USER or "survival-kit";
    POSTGRES_PASSWORD = config.secretspec.secrets.POSTGRES_PASSWORD or "survival-kit";
    MAIL_HOST = config.secretspec.secrets.MAIL_HOST or "localhost";
    MAIL_PORT = config.secretspec.secrets.MAIL_PORT or "1025";
    MAIL_USERNAME = config.secretspec.secrets.MAIL_USERNAME or "";
    MAIL_PASSWORD = config.secretspec.secrets.MAIL_PASSWORD or "";
    REDIS_PASSWORD = config.secretspec.secrets.REDIS_PASSWORD or "";
  };

  packages = [
    pkgs.git
    pkgs.jdk25
    pkgs.maven
    pkgs.nodejs_22
  ];

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    listen_addresses = "127.0.0.1";
    port = 5432;
    initialDatabases = [
      {
        name = "survival-kit";
        user = "survival-kit";
        pass = "survival-kit";
      }
    ];
  };

  services.redis = {
    enable = true;
    port = 6379;
  };

  scripts.run-backend.exec = ''
    cd "$DEVENV_ROOT/backend" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local "$@"
  '';

  scripts.run-frontend.exec = ''
    cd "$DEVENV_ROOT/frontend" && npm run dev "$@"
  '';

  processes.backend = {
    exec = "./mvnw spring-boot:run -Dspring-boot.run.profiles=local";
    cwd = "${config.git.root}/backend";
    ports.http.allocate = 8080;
    after = [
      "devenv:processes:postgres"
      "devenv:processes:redis"
    ];
    ready = {
      http.get = {
        port = 8080;
        path = "/v3/api-docs";
      };
      initial_delay = 1;
      period = 2;
    };
  };

  processes.frontend = {
    exec = "npm run dev";
    cwd = "${config.git.root}/frontend";
    ports.http.allocate = 5173;
    after = [
      "devenv:processes:backend"
    ];
  };

  enterShell = ''
    java -version
    node --version
  '';
}

