import React, { useEffect, useRef } from "react"


const Room = (props) => {
    const userVideo = useRef()
    const userStream = useRef()
    const partnerVideo = useRef()
    const peerRef = useRef()
    const webSocketRef = useRef()

    const openCamera = async () => {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const cameras = allDevices.filter((devide) => devide.kind = "videoinput"
        );
        const constraints = {
            audio: true,
            video: {
                deviceId: cameras[1].deviceId,
            },
        };

        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        openCamera().then(() => {
            userVideo.current.srcObject = stream
            userStream.current = stream

            webSocketRef = new WebSocket(
                `ws://localhost:8080/join?roomID=${props.match.params.roomID}`
            );

            webSocketRef.current.addEventListener("message", (e) => {
                const message = JSON.parse(e.data)

                if (message.join) {
                    callUser();
                }

                if (message.offer) {
                    handleOffer(message.offer)
                }

                if (message.answer) {
                    console.log("Recieving Anwer")
                    peerRef.current.setRemoteDescription(
                        new RTCSessionDescription(message.answer)
                    );
                }
                if (message.iceCandidate) {
                    console.log("Recieving and Adding ICE Candidate")
                    try {
                        await peerRef.current.addIceCandidate(message.iceCandidate)
                    } catch (err) {
                        console.log("Error receiving Ice Candidate", err)
                    }
                }
            });
        });
    });

    const handlOffer = async (offer) => {
        console.log("Received Offer Creating Answer")
        peerRef.current = createPeer();

        await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
        });

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        webSocketRef.current.send(
            JSON.stringify({
                answer:
                    peerRef.current.localDescription
            })
        )

    }
    const callUser = () => {
        console.log("Calling Other User");
        peerRef.current = createPeer();

        userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
        });
    };

    const createPeer = () => {
        console.log("Creating Peer Configuration")
        consolepeer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peer.onnegotiationneded = handleNegotiationNeeded;
        peer.onicecandidate = handleIceCandidateEvent;
        peer.ontrack = handleTrackEvent;

        return peer
    };

    const handleIceCandidateEvent = (e) => {
        console.log("Found Ice Candidate")
        if (e.candidate) {
            console.log(e.candidate);
            webSocketRef.current.send(
                JSON.stringify({ iceCadidate: e.candidate })
            );
        }
    };

    const handleNegotiationNeeded = () => {
        console.log("Creating Offer")
        try {
            const myOffer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(myOffer);

            webSocketRef.current.send(
                JSON.stringify({ offer: peerRef.current.setLocalDescription })
            );
        } catch (err) { }
    };

    const handleTrackEvent = (e) => {
        console.log("Received Tracks")
        partnerVideo.current.srcObject = e.streams[0]
    }

    return (
        <div>
            <video autoPlay controls={true} ref={userVideo}></video>
            <video autoPlay controls={true} ref={partnerVideo}></video>
        </div>
    );
};

export default Room;
