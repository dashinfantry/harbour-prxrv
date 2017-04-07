import QtQuick 2.2
import Sailfish.Silica 1.0

import "../js/booru.js" as Booru
import "../js/prxrv.js" as Prxrv

Page {
    id: detailPage

    property string workID: ''

    property var work: {}

    property int currentIndex: -1

    property int leftPadding: 25

    ListModel { id: tagModel }


    SilicaFlickable {
        id: detailFlickable
        contentHeight: column.height + 200

        anchors.fill: parent

        PageHeader {
            id: pageHeader
            width: parent.width
            title: work.headerText
        }

        Item {
            id: column
            width: parent.width
            height: childrenRect.height
            anchors.top: pageHeader.bottom

            Image {
                id: image
                width: parent.width - leftPadding*2
                anchors.horizontalCenter: parent.horizontalCenter

                fillMode: Image.PreserveAspectFit
                source: work.sample

                BusyIndicator {
                    anchors.centerIn: parent
                    running: image.status == Image.Loading
                }
            }

            Label {
                id: authorName
                width: parent.width - leftPadding*2
                anchors.top: image.bottom
                anchors.topMargin: Theme.paddingMedium
                anchors.horizontalCenter: parent.horizontalCenter
                color: Theme.secondaryColor
                text: qsTr("Uploaded by: ") + work.authorName
                elide: TruncationMode.Elide
            }

            Label {
                id: caption
                width: parent.width - leftPadding*2
                anchors.top: authorName.bottom
                anchors.topMargin: Theme.paddingMedium
                anchors.horizontalCenter: parent.horizontalCenter
                wrapMode: Text.WordWrap
                onLinkActivated: {
                    if (link.indexOf('illust_id=') > 0) {
                        var illust_id = link.substring(link.indexOf('_id=') + 4)
                        if (!isNaN(illust_id)) {
                            var _props = {"workID": illust_id, "authorID": "", "currentIndex": -1}
                            pageStack.push("DetailPage.qml", _props)
                        }
                    } else {
                        Qt.openUrlExternally(link)
                    }
                }
                color: Theme.primaryColor
                text: {
                    console.log('source:'+work.source+':')
                    if (work.source.indexOf('http') === 0 && work.source.indexOf('illust_id=') > 0) {
                        var illust_id = work.source.substr(work.source.indexOf('illust_id=')+10)
                        return 'Source: <a href="' + work.source + '">illust/' + illust_id + '</a>'
                    } else if (work.source.indexOf('pixiv.net/img-orig') > 0) {
                        var illust_name = work.source.substr(work.source.lastIndexOf('/')+1)
                        var illust_id = illust_name.substr(0, illust_name.indexOf('_'))
                        var pxv_url = 'http://touch.pixiv.net/member_illust.php?illust_id='+illust_id
                        return 'Source: <a href="' + pxv_url + '">illust/' + illust_id + '</a>'
                    } else if (work.source.indexOf('http') === 0) {
                        return 'Source: <a href="' + work.source + '">' + work.source + '</a>'
                    } else if (work.source !== '') {
                        return 'Source: ' + work.source
                    } else {
                        return ''
                    }
                }
            }

            Label {
                id: updateTime
                width: parent.width - leftPadding*2
                anchors.top: caption.bottom
                anchors.topMargin: 10
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignRight
                color: Theme.secondaryColor
                text: {
                    var t = new Date(work.createdAt*1000)
                    return t.toISOString().replace('T',' ').substr(0,19)
                }
            }

            ListView {
                anchors.top: updateTime.bottom
                anchors.topMargin: 10
                width: parent.width
                height: childrenRect.height

                model: tagModel
                delegate: ListItem {
                    width: parent.width
                    height: Theme.itemSizeSmall
                    Label {
                        width: parent.width - leftPadding*2
                        anchors.centerIn: parent
                        color: Theme.secondaryHighlightColor
                        text: tag
                    }
                    onClicked: {
                        // TODO
                        if (debugOn) console.log('tag clicked')
                    }
                }
            }
        }

    }


    onStatusChanged: {
        if (status == PageStatus.Active) {
            if (debugOn) console.log("detail page actived: " + workID)
        }

        /* TODO Cover
         *
         */
    }

    Component.onCompleted: {
        if (debugOn) console.log("details onCompleted")

        var tags = work.tags.split(' ')
        tagModel.clear()
        for (var i in tags) {
            tagModel.append( { tag: tags[i] } )
        }
    }
}
