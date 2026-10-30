package ru.urfu.exchangeProject.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.urfu.exchangeProject.model.jwt.JwtAuthentication;
import ru.urfu.exchangeProject.service.impl.JwtProvider;
import ru.urfu.exchangeProject.utils.JwtUtils;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION = "Authorization";

    private final JwtProvider jwtProvider;

    public JwtFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain fc)
            throws IOException, ServletException {
        final String token = getTokenFromRequest(request);
        if (token != null) {
            try {
                if (jwtProvider.validateAccessToken(token)) {
                    final Claims claims = jwtProvider.getAccessClaims(token);
                    JwtAuthentication authentication = JwtUtils.generate(claims);
                    if (StringUtils.hasText(authentication.getEmail()) && authentication.getRole() != null) {
                        authentication.setAuthenticated(true);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (JwtException | IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
            }
        }
        fc.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        final String bearer = request.getHeader(AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
