package com.ims.backend.modules.users.specification;

import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(
            String search,
            UserRole role,
            String department,
            UserStatus status
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
                Predicate firstNamePredicate = cb.like(cb.lower(root.get("firstName")), pattern);
                Predicate lastNamePredicate = cb.like(cb.lower(root.get("lastName")), pattern);
                predicates.add(cb.or(emailPredicate, firstNamePredicate, lastNamePredicate));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (StringUtils.hasText(department)) {
                predicates.add(cb.like(cb.lower(root.get("department")), "%" + department.trim().toLowerCase() + "%"));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
