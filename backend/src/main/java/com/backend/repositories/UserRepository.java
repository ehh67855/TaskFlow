package com.backend.repositories;

import com.backend.entites.Network;
import com.backend.entites.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByLogin(String login);

    // Used by the "find people" search on the Friends page - matches on login, first name, or
    // last name, excluding the searching user themselves.
    @Query("SELECT u FROM User u WHERE u.login <> :excludeLogin AND (" +
           "LOWER(u.login) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> search(@Param("query") String query, @Param("excludeLogin") String excludeLogin);

}
