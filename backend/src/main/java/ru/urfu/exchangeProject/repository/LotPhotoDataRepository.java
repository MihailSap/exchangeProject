package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.lot.LotPhoto;

@Repository
public interface LotPhotoDataRepository extends JpaRepository<LotPhoto, Long> {
}
