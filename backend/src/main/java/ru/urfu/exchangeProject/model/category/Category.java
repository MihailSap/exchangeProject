package ru.urfu.exchangeProject.model.category;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.want.Want;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    private String name;
    private String slug;
    private Boolean active;
    private Instant createdAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;
    @OneToMany(mappedBy = "parent", cascade = CascadeType.REMOVE)
    private List<Category> children = new ArrayList<>();
    @OneToMany(mappedBy = "category")
    private List<Lot> lots = new ArrayList<>();
    @OneToMany(mappedBy = "category")
    private List<Want> wants = new ArrayList<>();

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public Category getParent() {
        return parent;
    }

    public List<Category> getChildren() {
        return children;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public void setParent(Category parent) {
        this.parent = parent;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public void setChildren(List<Category> children) {
        this.children = children;
    }

    public List<Lot> getLots() {
        return lots;
    }

    public void setLots(List<Lot> lots) {
        this.lots = lots;
    }

    public List<Want> getWants() {
        return wants;
    }

    public void setWants(List<Want> wants) {
        this.wants = wants;
    }
}