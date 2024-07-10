package com.draw.together.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import com.draw.together.model.DrawMessage;

@Controller
public class DrawController {

    @MessageMapping("/draw")
    @SendTo("/topic/draw")
    public DrawMessage sendDrawing(DrawMessage message) {
        return message;
    }
}
