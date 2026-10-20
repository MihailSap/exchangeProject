package ru.urfu.exchangeProject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ExchangeProjectApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExchangeProjectApplication.class, args);
    }
}
