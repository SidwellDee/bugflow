pipeline {
    // A trusted Linux agent with Docker Engine and Docker Compose v2.
    agent { label 'docker' }
    tools {
        dockerTool 'docker-cli'
    }
    triggers {
        // Allows GitHub Webhook to trigger this pipeline
        githubPush()
    }
    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }
    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: false,
            description: 'Deploy on this agent Docker host after tests and image checks pass.')
    }
    environment {
        // Use one Jenkins deployment job per Compose project/data volume.
        IMAGE_REPOSITORY        = "bugflow"
        COMPOSE_PROJECT_NAME    = "bugflow"
        APP_ORIGIN              = "bugflow.devworxsd.com"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Check Docker') {
            steps {
                sh 'docker version && docker compose version'
                script { env.BUGFLOW_IMAGE = "${env.IMAGE_REPOSITORY}:${env.BUILD_NUMBER}" }
            }
        }
        stage('Test') {
            steps {
                sh 'docker build --pull --target test -t "$IMAGE_REPOSITORY:test-$BUILD_NUMBER" .'
            }
        }
        stage('Build production image') {
            steps {
                sh 'docker build --target runtime -t "$BUGFLOW_IMAGE" .'
            }
        }
        stage('Smoke test') {
            steps {
                sh '''
                    set -eu
                    check="bugflow-check-$BUILD_NUMBER"
                    trap 'docker rm --force --volumes "$check" >/dev/null 2>&1 || true' EXIT
                    # No host port, no production volume and no real Google credentials.
                    docker run --detach --name "$check" "$BUGFLOW_IMAGE" >/dev/null
                    ready=false
                    for attempt in $(seq 1 30); do
                        if docker exec "$check" node healthcheck.js; then
                            ready=true
                            break
                        fi
                        sleep 2
                    done
                    if [ "$ready" != true ]; then
                        docker logs "$check"
                        exit 1
                    fi
                '''
            }
        }
        stage('Deploy') {
            when { expression { params.DEPLOY } }
            steps {
                // Jenkins Secret file credential containing the deployment .env.
                // Its contents are never copied into the image or printed.
                withCredentials([file(credentialsId: 'bugflow-env', variable: 'BUGFLOW_ENV_FILE')]) {
                    sh '''
                        set -eu
                        set +x
                        docker compose --env-file "$BUGFLOW_ENV_FILE" config --quiet
                        docker compose --env-file "$BUGFLOW_ENV_FILE" up \
                            --detach --no-build --wait --wait-timeout 90
                    '''
                }
            }
        }
    }
    post {
        success { echo 'Tests, production build and image smoke check passed. Deployment runs only when DEPLOY is selected.' }
        failure { echo 'Pipeline failed. Inspect the failed stage before retrying. Persistent application data is not deleted.' }
    }
}
