/* pipeline {
    agent any
    options {
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }
    environment {
        BUILD_ENV = "prod"
    }
    stages {
        stage('Prepare ENV') {
            steps {
                sh 'printenv | sort'
            }
        }
        stage('Build') {
            steps {
              echo "Build Docker Image..."
              sh "docker build --rm --build-arg BUILD_ENV=${env.BUILD_ENV} -t webserver ."
            }
        }
        stage('Test') {
            steps {
                echo "doing test"
            }
        }
        stage('Push master && Deploy') {
            when {
                // branch 'master' 單分支不啟用
                environment name: 'AUTO_REDEPLOY', value: 'YES'
            }
            steps {
                echo 'Deploying...'
                sh "docker run -d -p 80:80 webserver"
            }
        }
    }
    post {
        always {
          echo 'notify...'
        }

        success {
            echo 'success...'
        }

        failure {
          echo 'failure...'
        }

        aborted {
          echo 'aborted...'
        }
    }
}

def notifyLINE(type, message) {
    def isFailure = type == 1
    def token = '797I9xzmtuGeQul3w7IBTwlXwjFjqyxjzBFFrYpT305'
    def url = 'https://notify-api.line.me/api/notify'
    def imageThumbnail = isFailure ? 'https://i.imgur.com/T31BMsh.png' : 'https://imgur.com/IV2Dxph.png'
    def imageFullsize = isFailure ? 'https://i.imgur.com/T31BMsh.png' : 'https://imgur.com/IV2Dxph.png'
    sh "curl ${url} -H 'Authorization: Bearer ${token}' -F 'message=${message}' -F 'imageThumbnail=${imageThumbnail}' -F 'imageFullsize=${imageFullsize}'"
}
 */

pipeline {
    agent any
    stages {
        stage('Example') {
      steps {
        echo 'Hello World'
      }
        }
        stage('Build') {
      steps {
        script {
          bat 'npm install'
          bat 'npm run build'
        }
      }
        }
        stage('Deploy') {
      steps {
        script {
          bat 'git ls-files'
          bat 'git init'
          bat 'git add dist'
          bat "git commit -m 'deploy'"
          bat 'git push -f https://github.com/babiysqaz/froggieBus.git master:gh-pages'
        }
      }
        }
    }
}
//test4
