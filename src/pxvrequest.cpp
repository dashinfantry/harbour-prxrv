#include <QDebug>
#include <QNetworkRequest>
#include <QFile>
#include <QFileInfo>
#include <QDir>

#include "utils.h"
#include "requestmgr.h"

PxvRequest::PxvRequest(QObject *parent) : QObject(parent) {}
PxvRequest::~PxvRequest() {
    if (this->qnrq)
        delete this->qnrq;
    if (this->qnr)
        this->qnr->deleteLater();
}

void PxvRequest::get(QNetworkAccessManager &qnam, QString url, QString path, QString filename) {

    // Check path
    QDir dir(path);
    if (!dir.exists()) {
       if (!dir.mkpath(".")) {
           path = "/home/nemo/";
           emit errorMessage("Failed to create directory.", this);
           // TODO system notification
       }
    }
    if (!path.endsWith('/'))
        path.append('/');
    this->path = path;

    // Check file path
    QFileInfo checkFile(path.append(filename));
    if (checkFile.exists()) {
        emit errorMessage("File exits: " + filename, this);
        return;
    }
    this->filename = filename;

    this->rqurl.setUrl(url);

    this->qnrq = new QNetworkRequest(rqurl);
    Utils::setHeaders(*this->qnrq, this->token);

    this->qnr = qnam.get(*qnrq);

    connect(this->qnr, &QNetworkReply::finished, this, &PxvRequest::writeFile);
    //connect(this->qnr, &QNetworkReply::error(QNetworkReply::NetworkError), this, &PxvRequest::emitFailed(QNetworkReply::NetworkError));
    connect(this->qnr, &QNetworkReply::downloadProgress, this, &PxvRequest::logProgress);

}

void PxvRequest::setToken(QString token, QString ref_token, int expires_in) {
    this->token = token;
    this->ref_token = ref_token;
    this->expire_time = QTime::currentTime().addSecs(expires_in);
}

void PxvRequest::abort() {
    this->isAborted = true;
    this->qnr->abort();
}

QString PxvRequest::getFilename() {
    return this->filename;
}

void PxvRequest::writeFile() {
    if (this->qnr->error() != QNetworkReply::NoError) {
        qDebug() << "Error occurred:" << this->qnr->error() << ", url:" << this->rqurl.toString();
        return;
    }
    if (this->isAborted) {
        qDebug() << "Abort writing ...";
        return;
    }
    QFile* file = new QFile(path.append(filename));
    if (file->open(QIODevice::WriteOnly)) {
        file->write(qnr->readAll());
        file->close();
        //qDebug() << filename.append(" finished");
        delete file;
        emit saveImageSucceeded(this);
    } else {
        qDebug() << filename.append(" failed");
        delete file;
        emit saveImageFailed(this);
    }
}

void PxvRequest::logProgress(qint64 received, qint64 total) {
    emit ((RequestMgr*)parent())->downloadProgress(this->filename, received, total);
}

void PxvRequest::emitFailed(QNetworkReply::NetworkError code) {
    qDebug() << "Error Code:" << code;
    emit saveImageFailed(this);
}
