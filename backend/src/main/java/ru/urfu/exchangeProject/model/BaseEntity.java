package ru.urfu.exchangeProject.model;

import jakarta.persistence.*;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    private static Class<?> getPersistentClass(Object entity) {
        if (entity instanceof HibernateProxy proxy) {
            return proxy.getHibernateLazyInitializer().getPersistentClass();
        }

        return entity.getClass();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || !(o instanceof BaseEntity that)) {
            return false;
        }

        if (getPersistentClass(this) != getPersistentClass(that)) {
            return false;
        }

        Long thisId = getId();
        Long thatId = that.getId();

        return thisId != null && thisId.equals(thatId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
