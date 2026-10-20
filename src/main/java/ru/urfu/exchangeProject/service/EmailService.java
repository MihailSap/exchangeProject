package ru.urfu.exchangeProject.service;

public interface EmailService {

    void sendEmail(String to, String subject, String text);

    void sendEmailConfirmEmail(String email, String token);

    void sendPasswordResetEmail(String email, String token);
}
