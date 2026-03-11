import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages, saveMessage } from "@/lib/supabase/queries/messages";
import { createConversation } from "@/lib/supabase/queries/conversations";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
    fileName?: string;
}

export function useChat(
    conversationId: string | null,
    onConversationCreated: (id: string) => void
) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

    const loadMessages = useCallback(async () => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        try {
            const data = await getMessages(conversationId);
            setMessages(data as Message[]);
        } catch (err) {
            console.error("메시지 불러오기 실패:", err);
        }
    }, [conversationId]);

    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!SpeechRecognitionAPI) {
            alert("이 브라우저에서는 음성 인식이 지원되지 않습니다.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "ko-KR";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setInput((prev) => prev + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("음성 인식 오류:", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    }, [isRecording]);

    const handleSend = async (overrideContent?: string) => {
        if (loading) return;

        const cleaned = (overrideContent ?? input).trim();

        if (cleaned.length < 2) {
            alert("메시지는 2글자 이상 입력해 주세요.");
            return;
        }

        if (/(.)\1{7,}/.test(cleaned)) {
            alert("반복 입력이 감지되어 전송을 막았습니다.");
            return;
        }

        const content = cleaned;
        const { data: authData } = await supabase.auth.getUser();
        const isLoggedIn = !!authData?.user;

        const attachedFileName = selectedFile?.name ?? null;

        setInput("");
        setSelectedFile(null);
        setLoading(true);
        setStreamingText("");

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        }

        let currentConversationId: string | null = conversationId;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            if (isLoggedIn) {
                if (!currentConversationId) {
                    const newConv = await createConversation(content.slice(0, 30));
                    currentConversationId = newConv.id;
                    onConversationCreated(newConv.id);
                }
                const convId = currentConversationId as string;
                const userMsg = await saveMessage(convId, "user", content);
                if (userMsg) {
                    const enrichedMsg: Message = {
                        ...(userMsg as Message),
                        ...(attachedFileName ? { fileName: attachedFileName } : {}),
                    };
                    setMessages((prev) => [...prev, enrichedMsg]);
                }
            } else {
                const tempUserMsg: Message = {
                    id: crypto.randomUUID(),
                    role: "user",
                    content,
                    created_at: new Date().toISOString(),
                    ...(attachedFileName ? { fileName: attachedFileName } : {}),
                };
                setMessages((prev) => [...prev, tempUserMsg]);
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: content }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const errorText = errData?.error || "AI 응답 중 오류가 발생했습니다.";

                if (isLoggedIn && currentConversationId) {
                    const aiErrorMsg = await saveMessage(currentConversationId, "assistant", errorText);
                    if (aiErrorMsg) setMessages((prev) => [...prev, aiErrorMsg as Message]);
                } else {
                    setMessages((prev) => [...prev, {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: errorText,
                        created_at: new Date().toISOString(),
                    }]);
                }
                setLoading(false);
                return;
            }

            const data = await res.json().catch(() => null);
            const aiContent = data?.reply?.trim() || "응답이 비어 있습니다.";

            if (isLoggedIn && currentConversationId) {
                const aiMsg = await saveMessage(currentConversationId, "assistant", aiContent);
                if (aiMsg) setMessages((prev) => [...prev, aiMsg as Message]);
            } else {
                setMessages((prev) => [...prev, {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: aiContent,
                    created_at: new Date().toISOString(),
                }]);
            }

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                const partial = streamingText.trim();
                if (partial && isLoggedIn && currentConversationId) {
                    const partialMsg = await saveMessage(
                        currentConversationId,
                        "assistant",
                        partial + "\n\n_(응답이 중지되었습니다)_"
                    );
                    if (partialMsg) setMessages((prev) => [...prev, partialMsg as Message]);
                }
            } else {
                console.error("handleSend 오류:", error);
                const errorText = "AI 응답 중 예기치 않은 오류가 발생했습니다.";
                if (isLoggedIn && currentConversationId) {
                    const aiErrorMsg = await saveMessage(currentConversationId, "assistant", errorText);
                    if (aiErrorMsg) setMessages((prev) => [...prev, aiErrorMsg as Message]);
                } else {
                    setMessages((prev) => [...prev, {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: errorText,
                        created_at: new Date().toISOString(),
                    }]);
                }
            }
        } finally {
            setLoading(false);
            setStreamingText("");
            abortControllerRef.current = null;
        }
    };

    return {
        messages,
        setMessages,
        input,
        setInput,
        loading,
        streamingText,
        selectedFile,
        setSelectedFile,
        isRecording,
        loadMessages,
        handleSend,
        handleStop,
        toggleRecording,
    };
}