import { DotsCircleHorizontal, Send, Settings } from "tabler-icons-react";

export const links = [
    { href: "/chat/conversations", children: "Conversations", icon: <Send /> },
    { href: "#", children: "Endpoints", icon: <DotsCircleHorizontal /> },
    { href: "#", children: "Settings", icon: <Settings /> },
];

export default links;
