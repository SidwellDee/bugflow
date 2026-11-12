pipeline {
    agent any
    tools {
        dockerTool 'docker-cli'
    }
    triggers {
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
        IMAGE_REPOSITORY        = "bugflow"
        COMPOSE_PROJECT_NAME    = "bugflow"
        APP_ORIGIN              = "https://bugflow.devworxsd.com"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Check Docker') {
            steps {
                sh 'docker version && docker compose version'
                script { env.BUGFLOW_IMAGE = "bugflow/web:latest" }
            }
        }
        stage('Build production image') {
            steps {
                sh 'docker build --target runtime -t "$BUGFLOW_IMAGE" .'
            }
        }
        stage('Deploy') {
            when { expression { params.DEPLOY } }
            steps {
                script {
                    sh "docker compose -p bugflow -f compose.yaml up -d --build --force-recreate"
                }
            }
        }
    }
    post {
        success { echo 'Tests, production build and image smoke check passed. Deployment runs only when DEPLOY is selected.' }
        failure { echo 'Pipeline failed. Inspect the failed stage before retrying. Persistent application data is not deleted.' }
    }
}
